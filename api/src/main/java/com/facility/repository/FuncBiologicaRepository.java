package com.facility.repository;

import com.facility.domain.FuncBiologica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FuncBiologicaRepository extends JpaRepository<FuncBiologica, Long> {}
